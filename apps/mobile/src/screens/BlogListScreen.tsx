import { FlatList, Pressable, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BlogPost, useBlogViewModel } from '@jayedaad/core';
import { theme } from '@jayedaad/ui-native';
import type { RootStackParamList } from '../navigation/RootNavigator';

// "See all" destination for Home's "Property tips" section — every
// published blog post, mirrors AllPropertiesScreen's simplicity (no
// filters here, just a scrollable list).
export function BlogListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { posts, isLoading } = useBlogViewModel();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !isLoading ? <Text style={styles.empty}>No articles yet — check back soon.</Text> : null
        }
        renderItem={({ item }) => (
          <BlogListCard post={item} onPress={() => navigation.navigate('BlogDetail', { slug: item.slug })} />
        )}
      />
    </SafeAreaView>
  );
}

function BlogListCard({ post, onPress }: { post: BlogPost; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {post.coverImageUrl ? (
        <Image source={{ uri: post.coverImageUrl }} style={styles.thumb} contentFit="cover" transition={150} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Ionicons name="newspaper-outline" size={22} color={theme.colors.muted} />
        </View>
      )}
      <View style={styles.body}>
        {post.category && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>{post.category.name}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>
        {post.readTime && <Text style={styles.readTime}>{post.readTime}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  list: { padding: theme.spacing.lg, gap: theme.spacing.md },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  card: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: theme.spacing.md,
  },
  thumb: { width: 84, height: 84, borderRadius: 14 },
  thumbPlaceholder: { backgroundColor: theme.colors.bg, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4, justifyContent: 'center' },
  tag: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.bg,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: { fontSize: 11, fontWeight: '600', color: theme.colors.primary },
  title: { fontSize: 14, fontWeight: '700', color: theme.colors.text, lineHeight: 19 },
  readTime: { fontSize: 12, color: theme.colors.muted },
});
